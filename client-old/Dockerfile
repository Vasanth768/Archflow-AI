FROM nginx:stable-alpine

# Copy custom Nginx configuration with API reverse proxy
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy application static files
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
