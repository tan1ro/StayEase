import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import connect_db, disconnect_db
from routes.analytics import router as analytics_router
from routes.attractions import router as attractions_router
from routes.auth import router as auth_router
from routes.bookings import router as bookings_router
from routes.invoices import router as invoices_router
from routes.notifications import router as notifications_router
from routes.offers import router as offers_router
from routes.pricing import router as pricing_router
from routes.referrals import router as referrals_router
from routes.reviews import router as reviews_router
from routes.rooms import router as rooms_router
from routes.waitlist import router as waitlist_router
from routes.wishlist import router as wishlist_router
from routes.hosts import router as hosts_router
from routes.inquiries import router as inquiries_router
from services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_db()
    start_scheduler()
    yield
    stop_scheduler()
    await disconnect_db()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError):
        field_errors: dict[str, str] = {}
        for e in exc.errors():
            loc = [str(p) for p in e.get("loc", []) if p not in ("body", "query", "path", "header")]
            key = ".".join(loc) if loc else "detail"
            field_errors[key] = e.get("msg", "Invalid value")
        return JSONResponse(status_code=422, content={"message": "Validation error", "errors": field_errors})

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            return JSONResponse(status_code=exc.status_code, content={"message": "Error", "errors": detail})
        return JSONResponse(status_code=exc.status_code, content={"message": str(detail)})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, __: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error", "request_id": request_id},
        )

    app.include_router(auth_router)
    app.include_router(rooms_router)
    app.include_router(bookings_router)
    app.include_router(reviews_router)
    app.include_router(pricing_router)
    app.include_router(offers_router)
    app.include_router(waitlist_router)
    app.include_router(analytics_router)
    app.include_router(attractions_router)
    app.include_router(invoices_router)
    app.include_router(notifications_router)
    app.include_router(referrals_router)
    app.include_router(wishlist_router)
    app.include_router(hosts_router)
    app.include_router(inquiries_router)

    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
