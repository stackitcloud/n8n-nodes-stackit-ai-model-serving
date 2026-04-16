# Variables
IMAGE_NAME = n8n-custom-node
CONTAINER_NAME = n8n-dev
PORT = 5678

.PHONY: build run stop clean

# Build the docker image
build:
	docker build -t $(IMAGE_NAME) .

# Run the container in detached mode (Volume mount removed!)
run:
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):5678 \
		$(IMAGE_NAME)
	@echo "n8n is starting at http://localhost:$(PORT)"

# Stop and remove the container
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Rebuild and restart
restart: stop build run

# View logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Clean up image
clean: stop
	docker rmi $(IMAGE_NAME)