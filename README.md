# NL-Extract to Vector Tiles with T-Rex in Docker

This tutorial is based on a small survey to make vector tiles from NLExtract data. See the official documentation (in Dutch): https://github.com/nlextract/NLExtract/wiki/Vectortiles

We tried [Tegola](http://tegola.io/), [T-rex](http://t-rex.tileserver.ch/), [Tippecanoe](https://github.com/mapbox/tippecanoe) and [TileserverGL](http://tileserver.org/). This tutorial used T-rex in Docker and the NLExtract brk-latest dataset.

#### NLExtract

NLExtract levert de zowel de [software](http://www.nlextract.nl/download) om [brongegevens](https://data.nlextract.nl/) zoals BAG of BRK in PostgreSQL te kunnen laden, als de bestanden welke rechtstreeks in PostgreSQL kunnen worden geladen.


## T-rex docker

To get T-rex running as Docker container pull the image:

    docker pull sourcepole/t-rex

Check if it is working:

    docker run sourcepole/t-rex --version

or

    docker run sourcepole/t-rex --help

for the documentation.

Link to official T-rex github repro: https://github.com/t-rex-tileserver/t-rex

## BRK
https://www.kadaster.nl/digitale-kadastrale-kaart-als-open-data

Download the BRK dataset from nlextract:

    wget https://data.nlextract.nl/brk/postgis/brk-201804.dmp

## Restore dump in postgis
Assuming you have already a Postgis database running, restore the data into a database. Here called `nlextract_vt`

    pg_restore -O -U postgres -d nlextract_vt brk-201804.dmp

## Transform data

    CREATE SCHEMA vt;
    CREATE MATERIALIZED VIEW vt.perceel SELECT ogc_fid AS gid, sectie, perceelnummer, waarde, ST_Transform(begrenzing, 3857) AS geom FROM latest.perceel;
    CREATE INDEX vt.perceel_geom_idx ON vt.perceel USING gist(geom);
    CREATE MATERIALIZED VIEW vt.pand SELECT gid, bouwjaar, ST_Transform(ST_Force2D(geovlak), 3857) AS geom FROM bagactueel.pand;
    CREATE INDEX vt.pand_geom_idx ON vt.pand USING gist(geom);
    CREATE MATERIALIZED VIEW vt.adres SELECT gid, openbareruimtenaam, huisnummer, huisletter, huisnummertoevoeging, postcode, woonplaatsnaam, gemeentenaam, provincienaam, ST_Transform(ST_Force2D(geopunt), 3857) AS geom FROM bagactueel.adres;
    CREATE INDEX vt.adres_geom_idx ON vt.adres USING gist(geom);
    CREATE USER vt WITH PASSWORD 'kortwachtwoord';
    GRANT SELECT ON ALL TABLES IN SCHEMA vt TO vt;


## T_rex config file

To generate a config file from all the data in de postgres database run:

    docker run  sourcepole/t-rex genconfig --dbconn postgresql://user:pass@localhost/dbname > /config/config_gen.toml

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
Have a look at our configuration file for percelen: [config/config.toml](/config/congif.toml)

## T_rex serve

    docker run -p 6767:6767 -v `pwd`/config:/config -v `pwd`/tiles:/var/data/out/tiles --name t-rex-nlextract sourcepole/t-rex serve --config /config/config.toml

To stop service:

    docker stop t-rex-nlextract

## T_rex cache

In order to create the cache and mount in to the host, the `generate` command has to be run as user `root`. The t_rex Dockerfile runs as `www-data`... 

    docker --user root -v `pwd`/config:/config -v `pwd`/tiles:/var/data/out/tiles  --name t-rex-nlextract_generate sourcepole/t-rex generate --config /config/config.toml

