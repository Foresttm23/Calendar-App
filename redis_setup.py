import redis
import os

r = redis.Redis(
    host="coherent-sloth-18071.upstash.io",
    port=6379,
    password=os.getenv("REDIS_PASSWORD"),
    ssl=True,
)
