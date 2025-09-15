# Api Gateway assignment

Apache API Gateway links:

1. http://10.120.32.81/kissat
2. http://10.120.32.81/dragonball
3. http://10.120.32.81/weather?q=Rome

Nginx API Gateway links:

1. http://10.120.33.68/kissat2
2. http://10.120.33.68/dragonball2
3. http://10.120.33.68/weather?q=Somero

Node.js API Gateway links:

1. http://10.120.32.52:3000/kissat3
2. http://10.120.32.52:3000/dragonball3
3. http://10.120.32.52:3000/weather?q=Helsinki

Configuration Files:

Apache

```nginx
<VirtualHost *:80>
    ServerName ellinor-946
    # SSL Proxy Support
    SSLProxyEngine On

    # API no 1
    ProxyPass /dragonball http://dragonball-api.com/api/characters/1
    ProxyPassReverse /dragonball http://dragonball-api.com/api/characters/1

    # API no 2
    ProxyPass /kissat http://meowfacts.herokuapp.com/
    ProxyPassReverse /kissat http://meowfacts.herokuapp.com/

    # Adding api key to a request
    RewriteEngine On
    RewriteCond %{QUERY_STRING} !(^|&)appid=(&|$)
    RewriteRule "^/weather" "https://api.openweathermap.org/data/2.5/weather?%{QUERY_STRING}&appid=<api_key>" [P]
    ProxyPassReverse "/weather" "https://api.openweathermap.org/data/2.5/weather"
</VirtualHost>
```

Nginx

```js
server {
    listen 80;
    server_name ellinor-940;

    # Define a DNS resolver (e.g., Google's public DNS servers)
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    location /kissat2 {
        proxy_pass http://meowfacts.herokuapp.com/;
        # set headers
        proxy_set_header Host meowfacts.herokuapp.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Enable SSL proxying
        proxy_ssl_server_name on;
    }

    # API no 2 the same way
    location /dragonball2 {
        proxy_pass http://dragonball-api.com/api/characters/2;
        # set headers
        proxy_set_header Host dragonball-api.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_ssl_server_name on;
    }

    # weather API
    location /weather {
        proxy_pass https://api.openweathermap.org/data/2.5/weather?appid=<api_key>&$args;
        # set headers
        proxy_set_header Host api.openweathermap.org;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

       # Enable SSL proxying
       proxy_ssl_server_name on;
    }
}
```

Node.js

```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {ClientRequest} from 'http';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.disable('x-powered-by');

const services = [
  {
    route: '/kissat3',
    target: 'http://meowfacts.herokuapp.com',
  },
  {
    route: '/dragonball3',
    target: 'http://dragonball-api.com/api',
  },
  {
    route: '/weather',
    target: 'http://api.openweathermap.org/data/2.5',
    on: {
      proxyReq: (proxyReq: ClientRequest) => {
        // Append API key
        const url = new URL(proxyReq.path!, 'https://api.openweathermap.org');
        url.searchParams.append('appid', process.env.WEATHER_API_KEY || '');
        proxyReq.path = url.pathname + url.search;
      },
    },
  },
];


services.forEach(({route, target, on}) => {
  const proxyOptions = {
    on,
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
    secure: process.env.NODE_ENV === 'production', // Enable SSL verification in production
  };

  console.log(proxyOptions);
  app.use(route, createProxyMiddleware(proxyOptions));
});

export default app;
```
