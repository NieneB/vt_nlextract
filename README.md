# NL-Extract to Vector Tiles with T-Rex in Docker

This tutorial is based on a small survey to make vector tiles from NLExtract data. See the official documentation (in Dutch): https://github.com/nlextract/NLExtract/wiki/Vectortiles

We tried [Tegola](http://tegola.io/), [`t-rex`](http://t-rex.tileserver.ch/), [Tippecanoe](https://github.com/mapbox/tippecanoe) and [TileserverGL](http://tileserver.org/). This tutorial used `t-rex` in Docker and the NLExtract brk-latest dataset.

#### NLExtract

NLExtract levert de zowel de [software](http://www.nlextract.nl/download) om [brongegevens](https://data.nlextract.nl/) zoals BAG of BRK in PostgreSQL te kunnen laden, als de bestanden welke rechtstreeks in PostgreSQL kunnen worden geladen.


## `t-rex` docker

To get `t-rex` running as Docker container pull the image:

    docker pull sourcepole/t-rex

Check if it is working:

    docker run sourcepole/t-rex --version

or for the documentation

    docker run sourcepole/t-rex --help


Link to official `t-rex` github repro: https://github.com/t-rex-tileserver/t-rex

## BRK
https://www.kadaster.nl/digitale-kadastrale-kaart-als-open-data

Download the BRK dataset from nlextract:

    wget https://data.nlextract.nl/brk/postgis/brk-201804.dmp

## Restore dump in postgis
Assuming you have already a Postgis database running, restore the data into a database. Here called `nlextract_vt`

    pg_restore -O -U postgres -d nlextract_vt brk-201804.dmp

## Transform data

``` sql
DROP MATERIALIZED VIEW perceel;
CREATE MATERIALIZED VIEW perceel AS
SELECT
        ogc_fid,                
        gml_id,                 
        gemeente,               
        sectie,                 
        perceelnummer,          
        waarde,                 
        perceelnummerrotatie,   
        ST_Transform(begrenzing, 3857)::geometry(POLYGON, 3857) AS geom             
FROM latest.perceel;
CREATE INDEX perceel_geom_idx ON perceel USING gist(geom);
```

## T_rex config file

To generate a config file from all the data in de postgres database run `genconfig`. Replace the `dbconn` string with your own database connections.

``` bash
docker run --rm sourcepole/t-rex genconfig --dbconn postgresql://user:pass@localhost/dbname > `pwd`/config/config_gen.toml
```

Manually edit this config file so it is to your needs. Make sure to set the cache and network settings correctly for accessing the server and data from outside the docker container:

```toml
[cache.file]
# File location is docker container location. (later we mount this location to the host)
base = "/var/data/out/tiles"  
#baseurl = "http://example.com/tiles"

[webserver]
#Bind address. Use 0.0.0.0 to listen on all adresses. For accessing outside Docker container!! 
bind = "0.0.0.0"
port = 6767
threads = 4
#cache_control_max_age = 43200
```
Have a look at our configuration file for percelen: [config/config.toml](https://github.com/NieneB/vt_nlextract/blob/master/config/config.toml)

## T_rex serve

``` bash
docker run --rm -d -p 6767:6767 -v `pwd`/config:/config -v `pwd`/tiles:/var/data/out/tiles --name t-rex-nlextract sourcepole/t-rex serve --config /config/config.toml
```

Tiles available at http://localhost:6767/perceel/{z}/{x}/{y}.pbf

To stop service:

    docker stop t-rex-nlextract

## T_rex cache

In order to create the cache and mount in to the host, the `generate` command has to be run as user `root`. The t_rex Dockerfile runs as `www-data`... 

``` bash
docker run --rm --user root -v `pwd`/config:/config -v `pwd`/tiles:/var/data/out/tiles  --name t-rex-nlextract_generate sourcepole/t-rex generate --config /config/config.toml
```

In order to use the tiles from a directory you need a simple http server. For example `python simpleHTTPSserver`. Run this in one repository above your tile repository.  

    python -m SimpleHTTPServer

http://www.pythonforbeginners.com/modules-in-python/how-to-use-simplehttpserver/

Tiles available at:

    http://localhost:8000/tile_repro/{z}/{x}/{y}.pbf


# Docker-compose

I run this project with `docker-compose` to have the right environmental variables, and connections to my postgres database. Have a look at the `docker-compose.yml` and `.env` for my settings. 

Some useful commands:

```bash
# serve as command in docker-compose.yml
docker-compose up -d t_rex 
# if config.toml changed, resart t-rex server
docker-compose restart -t 1 t_rex
# Follow logs from t-rex server 
docker-compose logs -f t_rex 
# to generate a cache
docker-compose run --rm --user root t_rex generate --config /config/config.toml
```

# Viewer

In the folder [/viewer](https://github.com/NieneB/vt_nlextract/tree/master/viewer) you will find a full working MapboxGL-js example. 

Download or clone this repro and run `index.html`. It will work with your own t-rex tile server if you have it running at `http://localhost:6767/perceel/{z}/{x}/{y}.pbf`