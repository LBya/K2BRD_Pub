from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import logging
import re
from datetime import datetime
from ..config.label_mapping import LabelConfig

logger = logging.getLogger(__name__)

class TrelloCard(BaseModel):
    id: str
    name: str
    description: str
    raw_description: Optional[str] = None
    list_name: Optional[str] = None
    project: Optional[str] = None
    due_date: Optional[datetime] = None
    effort: Optional[str] = None
    github_repo: Optional[str] = None
    impacted_assets: List[str] = Field(default_factory=list)
    stakeholders: List[str] = Field(default_factory=list)
    labels: List[str] = Field(default_factory=list)
    type: Optional[str] = None
    priority: Optional[str] = None

    @classmethod
    def from_trello_json(cls, json_data: Dict[str, Any], list_name_override: Optional[str] = None) -> "TrelloCard":
        parsed_data = {
            "id": json_data["id"],
            "name": json_data["name"],
            "list_name": list_name_override or json_data.get("list", {}).get("name"),
            "due_date": json_data.get("due"),
            "labels": [label["name"] for label in json_data.get("labels", [])]
        }
        
        full_description_text = json_data.get("desc", "")
        parsed_data['raw_description'] = full_description_text
        
        # Split description into metadata and main content
        delimiter_match = re.search(r'(### |<h[1-6]>)?\s*Description:\s*(</h[1-6]>)?', full_description_text, re.IGNORECASE)
        if delimiter_match:
            metadata_part = full_description_text[:delimiter_match.start()]
            description_part = full_description_text[delimiter_match.end():]
        else:
            metadata_part = full_description_text
            description_part = ""

        logger.debug(f"--- PARSING CARD: {parsed_data['name']} ---")
        logger.debug(f"METADATA PART:\n{metadata_part}")
        
        parsed_data["description"] = description_part.strip()

        # New line-by-line markdown parser
        for line in metadata_part.split('\n'):
            line_lower = line.strip().lower()
            if line_lower.startswith("repo:") or line_lower.startswith("relevant repo:"):
                # This regex finds the first http/https URL in the line.
                match = re.search(r'https?://[^\s)]+', line)
                if match:
                    # Assign the found URL directly.
                    parsed_data["github_repo"] = match.group(0)
                continue

            # General pattern for "- **Key:** Value"
            match = re.match(r'-\s*\*\*(.*?):\*\*\s*(.*)', line)
            if not match:
                # Fallback for "**Key:** Value" without the list dash
                match = re.match(r'\*\*(.*?):\*\*\s*(.*)', line)

            if match:
                key = match.group(1).strip().lower()
                value = match.group(2).strip()
                logger.debug(f"Found Key: '{key}', Value: '{value}'")

                if 'project' in key and not parsed_data.get('project'):
                    parsed_data['project'] = value
                elif 'due date' in key and not parsed_data.get('due_date'):
                    parsed_data['due_date'] = value
                elif 'effort' in key and not parsed_data.get('effort'):
                    parsed_data['effort'] = value
                elif 'repo' in key and not parsed_data.get('github_repo'):
                    # This regex finds the first http/https URL in the line.
                    match = re.search(r'https?://[^\s)]+', value)
                    if match:
                        # Assign the found URL directly.
                        parsed_data["github_repo"] = match.group(0)
                elif 'impacted assets' in key and not parsed_data.get('impacted_assets'):
                    parsed_data['impacted_assets'] = [asset.strip() for asset in value.split(',') if asset.strip()]
                elif 'stakeholders' in key and not parsed_data.get('stakeholders'):
                    parsed_data['stakeholders'] = [sh.strip() for sh in value.split(',') if sh.strip()]
        
        logger.debug(f"FINAL PARSED DATA for '{parsed_data['name']}': {parsed_data}")
        logger.debug("--- END PARSING ---")

        # Parse labels for type and priority
        for label in parsed_data["labels"]:
            if "Type:" in label:
                parsed_data["type"] = label.split(":")[-1].strip()
            if "Priority:" in label:
                parsed_data["priority"] = label.split(":")[-1].strip()

        return cls(**parsed_data)

    def get_mapped_labels(self, label_config: LabelConfig) -> Dict[str, str]:
        mapped_labels = {}
        for label in self.labels:
            if label in label_config.type_labels:
                mapped_labels['type'] = label
            elif label in label_config.priority_labels:
                mapped_labels['priority'] = label
            elif label in label_config.stakeholder_labels:
                mapped_labels.setdefault('stakeholders', []).append(label)
        return mapped_labels

    def get_clean_github_repo_url(self) -> str:
        if not self.github_repo:
            return ""
        
        # Find all URLs in the string
        urls = re.findall(r'https?://[^\s]+', self.github_repo)
        
        # Clean the URLs by removing trailing special characters
        cleaned_urls = [re.sub(r'[.,;)>]+$', '', url) for url in urls]
        
        # Remove duplicates while preserving order
        unique_urls = []
        for url in cleaned_urls:
            if url not in unique_urls:
                unique_urls.append(url)
        
        return ' '.join(unique_urls) if unique_urls else self.github_repo