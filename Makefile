IMAGE=behaviorguard:dev
CONTAINER=behaviorguard_app
HOST_DIR:=$(shell /bin/pwd)

.PHONY: docker-build docker-run docker-shell docker-stop

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --name $(CONTAINER) --rm -it \
	  -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 8081:8081 \
	  -e EXPO_NO_TELEMETRY=1 -e CHOKIDAR_USEPOLLING=true \
	  -v $(HOST_DIR):/app -v behaviorguard_node_modules:/app/node_modules \
	  $(IMAGE)

docker-shell:
	docker exec -it $(CONTAINER) bash

docker-stop:
	-docker rm -f $(CONTAINER)


