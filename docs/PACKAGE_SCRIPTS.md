// Scripts de setup, build e deploy
// Adicionar ao backend/package.json

{
  "scripts": {
    // ============ SETUP ============
    "setup:dev": "npm install && npm run migration:run && npm run seed",
    "setup:clean": "rm -rf node_modules dist && npm install",
    
    // ============ DATABASE ============
    "migration:generate": "typeorm migration:generate",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "seed": "node dist/database/seeds/index.js",
    
    // ============ BUILD ============
    "build": "nest build",
    "build:prod": "nest build --webpack --webpackPath webpack.config.js",
    
    // ============ DEVELOPMENT ============
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    // ============ TESTING ============
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch",
    
    // ============ LINTING ============
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    
    // ============ DOCKER ============
    "docker:build:dev": "docker build -t jb-pinturas-api:dev --target development .",
    "docker:build:prod": "docker build -t jb-pinturas-api:latest --target production .",
    "docker:up": "docker-compose -f ../docker-compose.yml up -d",
    "docker:down": "docker-compose -f ../docker-compose.yml down",
    "docker:logs": "docker-compose -f ../docker-compose.yml logs -f backend",
    "docker:clean": "docker-compose -f ../docker-compose.yml down -v",
    
    // ============ DEPLOYMENT ============
    "deploy:staging": "npm run build && npm run test:e2e && npm run docker:build:prod && echo 'Deploy to staging manually'",
    "deploy:prod": "npm run build && npm run test && npm run docker:build:prod && echo 'Deploy to production manually'",
    
    // ============ UTILITIES ============
    "health": "curl http://localhost:3000/health",
    "swagger": "open http://localhost:3000/api/docs"
  }
}
