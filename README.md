## PostGIS to Vector Tiles with T-rex in Docker


## T-rex docker

    docker pull sourcepole/t-rex
    docker run sourcepole/t-rex --version
    docker run -p 6767:6767 sourcepole/t-rex serve --bind=0.0.0.0 --openbrowser=false


## Download BRK

    wget https://data.nlextract.nl/brk/postgis/brk-201804.dmp

## Restore dump in postgis

    docker-compose run --rm gdal pg_restore -d nlextract_vt brk-201804.dmp


## T-rex config file

    docker-compose run --rm  t_rex t_rex genconfig --dbconn postgresql://user:pass@localhost/dbname > /config/config_gen.toml


## Trex serve

    docker-compose run --rm t_rex  serve --config /config/config.toml


## Trex cache

    docker-compose run --rm --user root t_rex generate --config /config/config.toml
