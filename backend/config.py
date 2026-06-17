from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "StayEase"
    APP_HOST: str
    APP_PORT: int
    ALLOWED_ORIGINS: str

    MONGO_URI: str
    MONGO_DB_NAME: str

    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_SERVER: str
    MAIL_PORT: int
    MAIL_USE_TLS: bool

    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_FROM: str

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    OPEN_METEO_BASE_URL: str

    GST_RATE: float
    GST_NUMBER: str

    GUEST_PLATFORM_FEE_PERCENT: float = 10.0
    HOST_PLATFORM_FEE_PERCENT: float = 3.0

    FRONTEND_URL: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

