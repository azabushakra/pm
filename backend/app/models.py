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
