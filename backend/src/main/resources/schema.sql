create table if not exists service_locations (
  id bigserial primary key,
  name varchar(160) not null,
  service_type varchar(40) not null,
  district varchar(100) not null,
  address varchar(300) not null,
  phone varchar(30),
  verified_at timestamp with time zone not null,
  active boolean not null default true
);
