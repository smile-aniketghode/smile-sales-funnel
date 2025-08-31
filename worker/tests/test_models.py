import pytest
from datetime import datetime, timedelta
from src.models import (
    Task, TaskStatus, TaskPriority,
    Deal, DealStatus, DealStage,
    EmailLog, ProcessingStatus, PrefilterResult,
    Person, PersonSource,
    Company, CompanySize, CompanySource
)


class TestTask:
    def test_task_creation(self):
        task = Task(
            title="Follow up with client",
            description="Need to send proposal by Friday",
            source_email_id="email-123",
            confidence=0.9,
            agent="gpt-4",
            audit_snippet="Please send the proposal by Friday"
        )
        assert task.title == "Follow up with client"
        assert task.status == TaskStatus.DRAFT
        assert task.priority == TaskPriority.MEDIUM
        assert task.is_high_confidence()
    
    def test_task_validation(self):
        # Test confidence validation
        with pytest.raises(ValueError, match="Confidence must be between 0.0 and 1.0"):
            Task(
                title="Test",
                description="Test",
                source_email_id="email-123",
                confidence=1.5,
                agent="gpt-4",
                audit_snippet="test"
            )
        
        # Test empty title validation
        with pytest.raises(ValueError, match="Title cannot be empty"):
            Task(
                title="   ",
                description="Test",
                source_email_id="email-123", 
                confidence=0.8,
                agent="gpt-4",
                audit_snippet="test"
            )


class TestDeal:
    def test_deal_creation(self):
        deal = Deal(
            title="New enterprise deal",
            description="Potential $50k contract",
            value=50000.0,
            currency="USD",
            probability=75,
            source_email_id="email-123",
            confidence=0.85,
            agent="gpt-4",
            audit_snippet="interested in a $50k contract"
        )
        assert deal.value == 50000.0
        assert deal.currency == "USD"
        assert deal.is_high_confidence()
        assert deal.is_high_value()
    
    def test_currency_validation(self):
        # Test valid currency
        deal = Deal(
            title="Test Deal",
            description="Test",
            currency="eur",  # lowercase should be converted
            source_email_id="email-123",
            confidence=0.8,
            agent="gpt-4",
            audit_snippet="test"
        )
        assert deal.currency == "EUR"
        
        # Test invalid currency
        with pytest.raises(ValueError, match="Currency must be one of"):
            Deal(
                title="Test Deal",
                description="Test",
                currency="XYZ",
                source_email_id="email-123",
                confidence=0.8,
                agent="gpt-4",
                audit_snippet="test"
            )


class TestEmailLog:
    def test_email_log_creation(self):
        log = EmailLog(
            message_id_hash="abc123",
            original_message_id="msg-456",
            subject="Test Email",
            sender_email="test@example.com",
            prefilter_result=PrefilterResult.PASSED,
            llm_tokens_used=150
        )
        assert log.sender_email == "test@example.com"
        assert log.status == ProcessingStatus.PROCESSED
        assert log.ttl > int(datetime.utcnow().timestamp())  # TTL should be in future
    
    def test_message_hash_generation(self):
        hash1 = EmailLog.generate_message_hash("msg-123", "Hello world")
        hash2 = EmailLog.generate_message_hash("msg-123", "Hello world")
        hash3 = EmailLog.generate_message_hash("msg-123", "Hello world!")
        
        assert hash1 == hash2  # Same input = same hash
        assert hash1 != hash3  # Different content = different hash
        assert len(hash1) == 64  # SHA256 = 64 hex characters
    
    def test_task_deal_tracking(self):
        log = EmailLog(
            message_id_hash="abc123",
            original_message_id="msg-456",
            subject="Test",
            sender_email="test@example.com",
            prefilter_result=PrefilterResult.PASSED
        )
        
        log.add_task_created("task-1")
        log.add_deal_created("deal-1")
        log.add_task_created("task-1")  # Should not duplicate
        
        assert len(log.tasks_created) == 1
        assert len(log.deals_created) == 1
        assert "task-1" in log.tasks_created
        assert "deal-1" in log.deals_created


class TestPerson:
    def test_person_creation(self):
        person = Person(
            email="john.doe@example.com",
            first_name="John",
            last_name="Doe",
            job_title="Software Engineer"
        )
        assert person.email == "john.doe@example.com"
        assert person.get_display_name() == "John Doe"
    
    def test_email_normalization(self):
        person = Person(email="TEST@EXAMPLE.COM")
        assert person.email == "test@example.com"
    
    def test_name_inference(self):
        person = Person(email="jane.smith@company.com")
        person.infer_name_from_email()
        assert person.first_name == "Jane"
        assert person.last_name == "Smith"
        assert person.name == "Jane Smith"


class TestCompany:
    def test_company_creation(self):
        company = Company(
            name="Example Corp",
            domain="example.com"
        )
        assert company.name == "Example Corp"
        assert company.domain == "example.com"
    
    def test_domain_inference(self):
        company = Company.from_domain("acme-corp.com")
        assert company.name == "Acme Corp"
        assert company.domain == "acme-corp.com" 
        assert company.website == "https://acme-corp.com"
        assert company.source == CompanySource.DOMAIN_INFERENCE
    
    def test_website_validation(self):
        company = Company(
            name="Test Corp",
            domain="test.com",
            website="test.com"  # Missing protocol
        )
        assert company.website == "https://test.com"