FROM python:3.9-slim

# Set working directory
WORKDIR /code

# Copy requirements
COPY ./requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application
COPY . .

# Set permissions for Hugging Face Spaces (runs as non-root user 'user' with uid 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Change ownership of /code to the new user
USER root
RUN chown -R user:user /code
USER user

# Hugging Face Spaces exposes port 7860
ENV PORT=7860
EXPOSE 7860

# Run the application
CMD ["python", "app.py"]
