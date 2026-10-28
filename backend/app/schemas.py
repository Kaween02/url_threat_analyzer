from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ScanIn(BaseModel):
    url: str = Field(min_length=4, max_length=2048)

class ScanOut(BaseModel):
    id: int
    url: str
    risk: str
    score: int
    explanation: str
    indicators: list[str]
    created_at: datetime
