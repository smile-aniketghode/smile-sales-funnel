import json
import requests
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class LLMClient:
    """Local LLM client for task and deal extraction using llama.cpp HTTP server"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.model_name = "local-llama"
        
        # JSON schema for structured output
        self.extraction_schema = {
            "type": "object",
            "properties": {
                "tasks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "maxLength": 200},
                            "description": {"type": "string"},
                            "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                            "due_date": {"type": "string", "format": "date"},
                            "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                            "snippet": {"type": "string", "maxLength": 500}
                        },
                        "required": ["title", "description", "confidence", "snippet"]
                    }
                },
                "deals": {
                    "type": "array", 
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "maxLength": 200},
                            "description": {"type": "string"},
                            "value": {"type": "number", "minimum": 0},
                            "currency": {"type": "string", "default": "USD"},
                            "stage": {"type": "string", "enum": ["lead", "qualified", "proposal", "negotiation", "closed"]},
                            "probability": {"type": "integer", "minimum": 0, "maximum": 100},
                            "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                            "snippet": {"type": "string", "maxLength": 500}
                        },
                        "required": ["title", "description", "confidence", "snippet"]
                    }
                }
            },
            "required": ["tasks", "deals"]
        }
    
    async def extract_tasks_and_deals(
        self, 
        email_content: str, 
        subject: str, 
        sender: str
    ) -> Dict[str, Any]:
        """
        Extract tasks and deals from email content using local LLM
        
        Args:
            email_content: Filtered email content
            subject: Email subject line
            sender: Sender email address
            
        Returns:
            Extraction results with tasks, deals, and metadata
        """
        try:
            # Prepare the prompt
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(email_content, subject, sender)
            
            # Call local LLM
            response = await self._call_llm(system_prompt, user_prompt)
            
            # Parse and validate response
            extraction_result = self._parse_and_validate_response(response)
            
            # Add metadata
            extraction_result.update({
                "agent": self.model_name,
                "processed_at": datetime.utcnow().isoformat(),
                "tokens_used": response.get("usage", {}).get("total_tokens", 0)
            })
            
            logger.info(f"LLM extraction complete. Tasks: {len(extraction_result['tasks'])}, Deals: {len(extraction_result['deals'])}")
            
            return extraction_result
            
        except Exception as e:
            logger.error(f"LLM extraction failed: {str(e)}")
            # Return empty results on failure rather than crashing
            return {
                "tasks": [],
                "deals": [],
                "agent": self.model_name,
                "processed_at": datetime.utcnow().isoformat(),
                "tokens_used": 0,
                "error": str(e)
            }
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for task/deal extraction"""
        return """You are a business email analyzer. Your job is to extract actionable tasks and potential deals from email content.

IMPORTANT RULES:
1. Only extract clear, actionable tasks - not vague references
2. Only identify potential deals with business value - not general inquiries  
3. Return valid JSON matching the required schema
4. Set confidence scores honestly (0.0-1.0)
5. Include the specific email snippet that led to each extraction
6. Return empty arrays if no clear tasks/deals are found
7. Be conservative - false negatives are better than false positives

TASK CRITERIA:
- Must have a clear action verb (send, call, review, complete, etc.)
- Must be specific enough to be actionable
- Should have identifiable deadlines when mentioned
- Examples: "Send proposal by Friday", "Schedule follow-up call", "Review contract terms"

DEAL CRITERIA: 
- Must indicate potential revenue or business opportunity
- Should mention monetary value, contract, purchase, or business relationship
- Must show genuine buying interest, not just information seeking
- Examples: "Interested in $50K contract", "Ready to purchase", "Budget approved for project"

Respond only with valid JSON matching the schema. No additional text."""

    def _build_user_prompt(self, content: str, subject: str, sender: str) -> str:
        """Build the user prompt with email content"""
        return f"""Analyze this email for tasks and deals:

SUBJECT: {subject}
FROM: {sender}

EMAIL CONTENT:
{content}

Extract actionable tasks and potential deals. Return JSON with tasks and deals arrays. Set confidence scores based on clarity and actionability."""

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Make HTTP request to local llama.cpp server"""
        try:
            # Prepare request payload for llama.cpp
            payload = {
                "prompt": f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n",
                "temperature": 0.1,  # Low temperature for consistent extraction
                "max_tokens": 2048,
                "stop": ["<|user|>", "<|system|>"],
                "stream": False,
                "json_schema": self.extraction_schema  # Some llama.cpp builds support this
            }
            
            # Make request to llama.cpp server
            response = requests.post(
                f"{self.base_url}/completion",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60  # 60 second timeout
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM server error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            # Extract the generated content
            generated_text = result.get("content", "")
            if not generated_text:
                raise Exception("Empty response from LLM server")
            
            # Add usage information if available
            usage_info = {
                "total_tokens": result.get("tokens_evaluated", 0) + result.get("tokens_predicted", 0),
                "prompt_tokens": result.get("tokens_evaluated", 0),
                "completion_tokens": result.get("tokens_predicted", 0)
            }
            
            return {
                "content": generated_text,
                "usage": usage_info
            }
            
        except requests.exceptions.ConnectionError:
            raise Exception("Cannot connect to LLM server. Is llama.cpp running on localhost:8080?")
        except requests.exceptions.Timeout:
            raise Exception("LLM server timeout after 60 seconds")
        except Exception as e:
            raise Exception(f"LLM request failed: {str(e)}")
    
    def _parse_and_validate_response(self, llm_response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate the LLM response"""
        try:
            # Extract JSON from the response
            content = llm_response.get("content", "").strip()
            
            # Find JSON in the response (it might have extra text)
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            
            if json_start == -1 or json_end == 0:
                logger.warning("No JSON found in LLM response, returning empty results")
                return {"tasks": [], "deals": []}
            
            json_str = content[json_start:json_end]
            parsed_data = json.loads(json_str)
            
            # Validate structure
            if not isinstance(parsed_data, dict):
                raise ValueError("Response is not a JSON object")
            
            # Ensure required fields exist
            tasks = parsed_data.get("tasks", [])
            deals = parsed_data.get("deals", [])
            
            if not isinstance(tasks, list):
                tasks = []
            if not isinstance(deals, list):
                deals = []
            
            # Validate and clean task objects
            validated_tasks = []
            for task in tasks:
                if self._validate_task(task):
                    validated_tasks.append(task)
                else:
                    logger.warning(f"Invalid task filtered out: {task}")
            
            # Validate and clean deal objects
            validated_deals = []
            for deal in deals:
                if self._validate_deal(deal):
                    validated_deals.append(deal)
                else:
                    logger.warning(f"Invalid deal filtered out: {deal}")
            
            return {
                "tasks": validated_tasks,
                "deals": validated_deals
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in LLM response: {e}")
            return {"tasks": [], "deals": []}
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            return {"tasks": [], "deals": []}
    
    def _validate_task(self, task: Dict[str, Any]) -> bool:
        """Validate individual task object"""
        try:
            required_fields = ["title", "description", "confidence", "snippet"]
            if not all(field in task for field in required_fields):
                return False
            
            # Validate types and constraints
            if not isinstance(task["title"], str) or len(task["title"].strip()) == 0:
                return False
            if not isinstance(task["description"], str) or len(task["description"].strip()) == 0:
                return False
            if not isinstance(task["confidence"], (int, float)) or not (0.0 <= task["confidence"] <= 1.0):
                return False
            if not isinstance(task["snippet"], str):
                return False
                
            return True
        except:
            return False
    
    def _validate_deal(self, deal: Dict[str, Any]) -> bool:
        """Validate individual deal object"""
        try:
            required_fields = ["title", "description", "confidence", "snippet"]
            if not all(field in deal for field in required_fields):
                return False
            
            # Validate types and constraints
            if not isinstance(deal["title"], str) or len(deal["title"].strip()) == 0:
                return False
            if not isinstance(deal["description"], str) or len(deal["description"].strip()) == 0:
                return False
            if not isinstance(deal["confidence"], (int, float)) or not (0.0 <= deal["confidence"] <= 1.0):
                return False
            if not isinstance(deal["snippet"], str):
                return False
                
            # Optional fields validation
            if "value" in deal and deal["value"] is not None:
                if not isinstance(deal["value"], (int, float)) or deal["value"] < 0:
                    return False
            
            if "probability" in deal and deal["probability"] is not None:
                if not isinstance(deal["probability"], int) or not (0 <= deal["probability"] <= 100):
                    return False
                    
            return True
        except:
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if the LLM server is healthy"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                return {"status": "healthy", "server": self.base_url}
            else:
                return {"status": "unhealthy", "error": f"Status code: {response.status_code}"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}