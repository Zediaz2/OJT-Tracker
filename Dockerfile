FROM php:8.2-apache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Install SQLite dependencies
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Copy the application files
COPY . /var/www/html/

WORKDIR /var/www/html

# Replace standard Apache port 80 with the Railway $PORT environment variable
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Set up write permissions for SQLite database and report uploads
RUN mkdir -p /var/www/html/database /var/www/html/frontend/uploads \
    && chown -R www-data:www-data /var/www/html/database /var/www/html/frontend/uploads \
    && chmod -R 775 /var/www/html/database /var/www/html/frontend/uploads

# Redirect root domain to the frontend dashboard
RUN echo "RedirectMatch ^/$ /frontend/index.html" >> /etc/apache2/apache2.conf

# Since Railway file systems are ephemeral, we prepare a startup script 
# to ensure the SQLite DB initializes properly on every boot into the persistent volume.
RUN echo '#!/bin/bash\n\
if [ ! -f /var/www/html/database/ojt_tracker.sqlite ]; then\n\
    echo "Initializing SQLite Database..."\n\
    php /var/www/html/backend/config/init_db.php\n\
    chown www-data:www-data /var/www/html/database/ojt_tracker.sqlite\n\
    chmod 664 /var/www/html/database/ojt_tracker.sqlite\n\
fi\n\
exec apache2-foreground\n\
' > /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
