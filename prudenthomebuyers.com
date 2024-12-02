server {
    listen 80;
    server_name prudenthomebuyers.com www.prudenthomebuyers.com;

    location / {
        root /var/www/html;
        index index.html index.htm;
    }

    location /api/ {
        proxy_pass http://localhost:3005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name prudenthomebuyers.com www.prudenthomebuyers.com;

    ssl_certificate /etc/letsencrypt/live/prudenthomebuyers.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prudenthomebuyers.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        root /var/www/html;
        index index.html index.htm;
    }

    location /api/ {
        proxy_pass http://localhost:3005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    if ($host = www.prudenthomebuyers.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = prudenthomebuyers.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name prudenthomebuyers.com www.prudenthomebuyers.com;
    return 404;
}
