#!/usr/bin/env python3
"""
Quick API Test - Tests existing data and API functionality

Tests:
1. Fetch current tasks/deals/contacts
2. Test deal stage progression
3. Test task status updates
4. Verify data integrity
"""

import os
import sys
import requests
import logging
from typing import List, Dict

# Configuration
USER_ID = os.getenv("TEST_USER_ID", "aniket.ghode@shreemaruti.com")
API_BASE = os.getenv("API_BASE_URL", "https://api-production-20f0.up.railway.app")

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_deals(status=None) -> List[Dict]:
    """Get deals from API"""
    params = {'user_id': USER_ID}
    if status:
        params['status'] = status
    response = requests.get(f"{API_BASE}/deals", params=params, timeout=10)
    response.raise_for_status()
    return response.json().get('deals', [])


def get_tasks(status=None) -> List[Dict]:
    """Get tasks from API"""
    params = {'user_id': USER_ID}
    if status:
        params['status'] = status
    response = requests.get(f"{API_BASE}/tasks", params=params, timeout=10)
    response.raise_for_status()
    return response.json().get('tasks', [])


def get_contacts() -> List[Dict]:
    """Get contacts from API"""
    params = {'user_id': USER_ID}
    response = requests.get(f"{API_BASE}/contacts", params=params, timeout=10)
    response.raise_for_status()
    return response.json().get('contacts', [])


def update_deal(deal_id: str, **updates) -> bool:
    """Update deal via API"""
    try:
        response = requests.put(f"{API_BASE}/deals/{deal_id}", json=updates, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to update deal: {e}")
        return False


def update_task(task_id: str, **updates) -> bool:
    """Update task via API"""
    try:
        response = requests.put(f"{API_BASE}/tasks/{task_id}", json=updates, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        return False


def main():
    print("\n" + "="*70)
    print("  SMILe Sales Funnel - Quick API Test")
    print("="*70)
    print(f"User: {USER_ID}")
    print(f"API: {API_BASE}")
    print("="*70 + "\n")

    # Fetch current data
    logger.info("📊 Fetching current data...")
    deals = get_deals()
    tasks = get_tasks()
    contacts = get_contacts()

    logger.info(f"✅ Found {len(deals)} deals, {len(tasks)} tasks, {len(contacts)} contacts")

    if len(deals) == 0:
        logger.warning("⚠️  No deals found. Send test emails first!")
        return

    # Test deal stage progression
    print("\n📈 Testing Deal Stage Progression...")
    print("-" * 70)
    test_deal = deals[0]
    deal_id = test_deal['id']
    original_stage = test_deal.get('stage', 'unknown')

    logger.info(f"Testing with deal: {test_deal.get('title', 'Unknown')[:50]}")
    logger.info(f"Current stage: {original_stage}")

    stages = ['lead', 'contacted', 'demo', 'proposal']
    for stage in stages:
        logger.info(f"  → Updating to stage: {stage}...")
        success = update_deal(deal_id, stage=stage)
        if success:
            logger.info(f"    ✅ Updated to {stage}")
        else:
            logger.error(f"    ❌ Failed to update to {stage}")

    # Verify final stage
    updated_deals = get_deals()
    updated_deal = next((d for d in updated_deals if d['id'] == deal_id), None)
    if updated_deal:
        final_stage = updated_deal.get('stage')
        logger.info(f"\n  Final stage: {final_stage}")
        if final_stage == 'proposal':
            logger.info("  ✅ Deal progression test PASSED")
        else:
            logger.error(f"  ❌ Expected 'proposal', got '{final_stage}'")

    if len(tasks) == 0:
        logger.warning("\n⚠️  No tasks found for status test")
        return

    # Test task status updates
    print("\n✅ Testing Task Status Updates...")
    print("-" * 70)
    test_task = tasks[0]
    task_id = test_task['id']
    original_status = test_task.get('status', 'unknown')

    logger.info(f"Testing with task: {test_task.get('title', 'Unknown')[:50]}")
    logger.info(f"Current status: {original_status}")

    statuses = ['accepted', 'in_progress', 'completed']
    for status in statuses:
        logger.info(f"  → Updating to status: {status}...")
        success = update_task(task_id, status=status)
        if success:
            logger.info(f"    ✅ Updated to {status}")
        else:
            logger.error(f"    ❌ Failed to update to {status}")

    # Verify final status
    updated_tasks = get_tasks()
    updated_task = next((t for t in updated_tasks if t['id'] == task_id), None)
    if updated_task:
        final_status = updated_task.get('status')
        logger.info(f"\n  Final status: {final_status}")
        if final_status == 'completed':
            logger.info("  ✅ Task status test PASSED")
        else:
            logger.error(f"  ❌ Expected 'completed', got '{final_status}'")

    # Data integrity checks
    print("\n🔍 Data Integrity Checks...")
    print("-" * 70)

    # Check all data belongs to correct user
    all_correct_user = all(d.get('user_id') == USER_ID for d in deals + tasks)
    logger.info(f"  All data belongs to {USER_ID}: {'✅ YES' if all_correct_user else '❌ NO'}")

    # Check for duplicates
    deal_ids = [d['id'] for d in deals]
    task_ids = [t['id'] for t in tasks]
    logger.info(f"  Deals unique: {'✅ YES' if len(deal_ids) == len(set(deal_ids)) else '❌ NO'}")
    logger.info(f"  Tasks unique: {'✅ YES' if len(task_ids) == len(set(task_ids)) else '❌ NO'}")

    print("\n" + "="*70)
    print("  Test Complete!")
    print("="*70 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Test interrupted")
        sys.exit(130)
    except Exception as e:
        logger.error(f"\n\n❌ Test failed: {e}", exc_info=True)
        sys.exit(1)
