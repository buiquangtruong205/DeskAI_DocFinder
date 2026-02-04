import os

class Config:
    ENV = os.getenv('ENV', 'development')

config = Config()
