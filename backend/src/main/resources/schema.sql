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

-- Governed clinical knowledge store. Source-based seed records are DRAFT and
-- cannot influence routing or Ollama output until a qualified reviewer changes
-- both pathway and guidance status to APPROVED.
create table if not exists clinical_source (
  source_id varchar(80) primary key,
  title text not null,
  publisher text not null,
  published_year integer,
  source_url text not null,
  licence_note text not null,
  accessed_on date not null
);

create table if not exists clinical_pathway (
  pathway_id varchar(100) primary key,
  title text not null,
  status varchar(50) not null,
  dataset_version varchar(30) not null,
  scope text not null,
  reviewer_name text,
  approved_on date,
  created_on date not null
);

create table if not exists clinical_criterion (
  criterion_id bigserial primary key,
  pathway_id varchar(100) not null references clinical_pathway(pathway_id),
  criterion_type varchar(50) not null,
  input_code varchar(100) not null,
  constraint uq_clinical_criterion unique (pathway_id, criterion_type, input_code)
);

create table if not exists clinical_pathway_source (
  pathway_id varchar(100) not null references clinical_pathway(pathway_id),
  source_id varchar(80) not null references clinical_source(source_id),
  primary key (pathway_id, source_id)
);

create table if not exists clinical_guidance (
  guidance_id bigserial primary key,
  pathway_id varchar(100) not null references clinical_pathway(pathway_id),
  route varchar(50) not null,
  language varchar(10) not null,
  guidance_type varchar(50) not null,
  guidance_text text not null,
  status varchar(50) not null,
  constraint uq_clinical_guidance unique (pathway_id, route, language, guidance_type)
);
