.PHONY: dev up down build test logs migrate seed

dev:
	docker-compose up -d
	@echo "Local infra running. Now run services individually or use Tilt."

up:
	docker-compose up -d

down:
	docker-compose down -v

logs:
	docker-compose logs -f

migrate:
	@echo "Running database migrations (will add tools here)"

seed:
	@echo "Seeding sample data..."
