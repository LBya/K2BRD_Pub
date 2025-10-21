import pytest
from src.models.card import TrelloCard

@pytest.mark.parametrize(
    "test_id, json_data, list_name, expected_attrs",
    [
        (
            "full_card",
            {
                "id": "1",
                "name": "Test Card",
                "desc": "Project: Test Project\nRepo: user/repo\nEffort: 5\nImpacted Assets: a.txt, b.txt\nStakeholders: User1, User2",
                "labels": [{"name": "Type: Feature"}, {"name": "Priority: High"}]
            },
            "To Do",
            {
                "id": "1", "name": "Test Card", "project": "Test Project",
                "github_repo": "user/repo", "effort": "5", "type": "Feature",
                "priority": "High", "list_name": "To Do",
                "impacted_assets": ["a.txt", "b.txt"], "stakeholders": ["User1", "User2"]
            }
        ),
        (
            "basic_card",
            {
                "id": "1",
                "name": "Test Card",
                "desc": "Project: Test Project\nRepo: user/repo\nEffort: 5",
                "labels": [{"name": "Type: Feature"}, {"name": "Priority: High"}]
            },
            "To Do",
            {
                "id": "1", "name": "Test Card", "project": "Test Project",
                "github_repo": "user/repo", "effort": "5", "type": "Feature",
                "priority": "High", "list_name": "To Do",
                "impacted_assets": [], "stakeholders": []
            }
        ),
        (
            "minimal_card",
            {
                "id": "2",
                "name": "Minimal Card",
                "desc": "Just a description.",
                "labels": []
            },
            "In Progress",
            {
                "id": "2", "name": "Minimal Card", "description": "Just a description.",
                "project": None, "github_repo": None, "effort": None,
                "type": None, "priority": None, "list_name": "In Progress",
                "impacted_assets": [], "stakeholders": []
            }
        ),
    ],
    ids=["full_card_data", "basic_card_no_assets", "minimal_card_no_details"]
)
def test_trello_card_creation(test_id, json_data, list_name, expected_attrs):
    """Test the creation of a TrelloCard from various JSON payloads."""
    card = TrelloCard.from_trello_json(json_data, list_name)

    for attr, expected_value in expected_attrs.items():
        assert getattr(card, attr) == expected_value 