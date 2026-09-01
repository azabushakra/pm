from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CardModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    details: str


class ColumnModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    cardIds: list[str] = Field(default_factory=list)


class BoardModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    columns: list[ColumnModel]
    cards: dict[str, CardModel]


class BoardResponseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    board: BoardModel


class ChatHistoryMessageModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class AIChatRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=1)
    message: str = Field(min_length=1)


class AIModelOutputModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assistantMessage: str = Field(min_length=1)
    board: BoardModel | None = None


class AIChatResponseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    assistantMessage: str
    boardUpdated: bool
    usedFallback: bool
    board: BoardModel
