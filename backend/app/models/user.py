import enum

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole),
        default=UserRole.USER,
        nullable=False
    )
    created_at = Column(DateTime, server_default=func.now())