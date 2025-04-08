# Use an official Node.js runtime as a parent image
FROM public.ecr.aws/lambda/nodejs:18

# Set the working directory in the container
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package.json and pnpm-lock.yaml (assuming pnpm)
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
# Using --frozen-lockfile for reproducibility based on the lock file
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Install Playwright browsers needed by your app
# Note: This command downloads browser binaries into the image
RUN npx playwright install --with-deps chromium

# Copy the rest of your application code
COPY src/ ./src/
COPY config/ ./config/
# Add other necessary files/dirs if any, e.g., test-local.js if needed by handler

# Set the CMD to your handler (assuming src/index.js exports 'handler')
# Ensure src/index.js has an exported function named 'handler'
CMD [ "src/index.handler" ] 