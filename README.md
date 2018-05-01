## PostGIS to Vector Tiles with T-rex in Docker


## T_rex docker

    docker pull sourcepole/t-rex
    docker run sourcepole/t-rex --version
    docker run -p 6767:6767 sourcepole/t-rex serve --bind=0.0.0.0 --openbrowser=false


## Download BRK

    wget https://data.nlextract.nl/brk/postgis/brk-201804.dmp

## Set .env

Set the right environment variables in the `.env` file. 

## Restore dump in postgis

    docker-compose run --rm gdal pg_restore -d nlextract_vt brk-201804.dmp


## T_rex config file

To generate a config file from all the data in de postgres database run:

    docker-compose run --rm  t_rex t_rex genconfig --dbconn postgresql://user:pass@localhost/dbname > /config/config_gen.toml

Manually edit. Make sure to set the cache and network settings correctly for accessing the server and data from outside the docker container:

```toml
[cache.file]
# File location is docker container location. (in the docker-compose this location gets mounted to the host)
base = "/var/data/out/tiles"  
#baseurl = "http://example.com/tiles"

[webserver]
#Bind address. Use 0.0.0.0 to listen on all adresses. For accessing outside Docker container!! 
bind = "0.0.0.0"
port = 6767
threads = 4
#cache_control_max_age = 43200
```

## T_rex serve

    docker-compose run --rm t_rex  serve --config /config/config.toml


## T_rex cache

In order to create the cache and mount in to the host, the `generate` command has to be run as user `root`. The t_rex Dockerfile runs as `www-data`... 

    docker-compose run --rm --user root t_rex generate --config /config/config.toml
