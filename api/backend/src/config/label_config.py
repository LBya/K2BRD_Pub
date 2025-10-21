from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class LabelCategory(BaseModel):
    name: str = Field(..., max_length=250)
    values: List[str] = Field(..., max_items=4)

class LabelConfig(BaseModel):
    categories: Dict[str, LabelCategory] = Field(..., max_items=3)

    @classmethod
    def default_config(cls):
        return cls(
            categories={
                "type": LabelCategory(
                    name="Type",
                    values=["Enhancement", "Bug", "Feature", "Task"]
                ),
                "priority": LabelCategory(
                    name="Priority",
                    values=["Critical", "High", "Medium", "Low"]
                ),
                "status": LabelCategory(
                    name="Status",
                    values=["In Progress", "Blocked", "Ready", "Done"]
                )
            }
        ) 