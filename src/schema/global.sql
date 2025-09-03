CREATE TABLE global_static_route(
  url TEXT PRIMARY KEY,
  status INTEGER NOT NULL,
  body TEXT NOT NULL
) STRICT; 

CREATE TABLE global_static_route_header(
  global_static_route_url TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (global_static_route_url) REFERENCES global_static_route(url) ON UPDATE CASCADE ON DELETE CASCADE,
  unique (global_static_route_url, name)
) STRICT;
