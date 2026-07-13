--
-- PostgreSQL database dump
--

\restrict B2aV8Q1dbf4couSXBkDaksEcQ9qHcbT8ICzpji9DlSmTpS0wmFRWqfiMdTKYqAV

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    session_id text NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: newsletter_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.newsletter_subscriptions (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.newsletter_subscriptions OWNER TO postgres;

--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.newsletter_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_subscriptions_id_seq OWNER TO postgres;

--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.newsletter_subscriptions_id_seq OWNED BY public.newsletter_subscriptions.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_title text NOT NULL,
    product_image text,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    size text
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    shipping_address text,
    city text,
    county text,
    postal_code text,
    notes text,
    total numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    netopia_order_id text,
    session_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    compare_price numeric(10,2),
    images text[] DEFAULT '{}'::text[] NOT NULL,
    category_id integer NOT NULL,
    sizes text[] DEFAULT '{}'::text[] NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    badge text,
    sku text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    reviewer_name text NOT NULL,
    reviewer_email text,
    rating integer NOT NULL,
    comment text,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist_items (
    id integer NOT NULL,
    session_id text NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlist_items OWNER TO postgres;

--
-- Name: wishlist_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wishlist_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlist_items_id_seq OWNER TO postgres;

--
-- Name: wishlist_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlist_items_id_seq OWNED BY public.wishlist_items.id;


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: newsletter_subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.newsletter_subscriptions_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: wishlist_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items ALTER COLUMN id SET DEFAULT nextval('public.wishlist_items_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, session_id, product_id, quantity, size, price, created_at) FROM stdin;
1	a83a4a4e-65ed-4744-9f0a-02a88ce54d85	12	1	\N	459.00	2026-05-25 09:48:48.835168
2	c1fbe2b8-5482-4d5f-95db-91608fa16da1	11	1	\N	799.00	2026-05-25 15:22:03.448078
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image_url, created_at) FROM stdin;
1	Dresses	dresses	Elegant dresses for every occasion	\N	2026-05-25 09:25:18.882278
2	Blouses	blouses	Elegant blouses for every occasion	\N	2026-05-25 09:25:30.944785
3	Outerwear	outerwear	Coats and jackets	\N	2026-05-25 09:25:30.996104
4	Accessories	accessories	Jewellery, scarves, and more	\N	2026-05-25 09:25:31.044824
5	Bags	bags	Handbags and clutches	\N	2026-05-25 09:25:31.094107
\.


--
-- Data for Name: newsletter_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.newsletter_subscriptions (id, email, name, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_title, product_image, price, quantity, size) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, customer_name, customer_email, customer_phone, shipping_address, city, county, postal_code, notes, total, status, payment_status, payment_method, netopia_order_id, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, title, description, price, compare_price, images, category_id, sizes, stock, badge, sku, active, created_at) FROM stdin;
1	Silk Wrap Midi Dress	A fluid wrap silhouette in pure silk charmeuse. Adjustable tie waist, deep V-neckline, midi hem.	549.00	699.00	{https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=800&auto=format&fit=crop}	1	{XS,S,M,L,XL}	12	Best Seller	ANK-D001	t	2026-05-25 09:30:01.867217
2	Linen Column Dress	Minimalist column dress in premium Belgian linen. A-line cut, sleeveless, knee length.	389.00	\N	{https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop}	1	{XS,S,M,L}	8	New	ANK-D002	t	2026-05-25 09:30:01.874356
3	Velvet Evening Gown	Floor-length gown in rich crushed velvet. Off-shoulder neckline, ruched bodice, hidden side zipper.	899.00	\N	{https://images.unsplash.com/photo-1566479179817-70fbc45572f3?q=80&w=800&auto=format&fit=crop}	1	{S,M,L}	4	Limited	ANK-D003	t	2026-05-25 09:30:01.878258
4	Pleated Chiffon Maxi	Flowy pleated chiffon maxi dress. Elasticated waist, V-neck, flutter sleeves.	469.00	\N	{https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop}	1	{XS,S,M,L,XL,XXL}	15	\N	ANK-D004	t	2026-05-25 09:30:01.883141
5	French Tuck Silk Blouse	Buttery soft silk blouse with a relaxed fit. Single button cuff, collarless neckline.	299.00	\N	{https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=800&auto=format&fit=crop}	2	{XS,S,M,L,XL}	20	Best Seller	ANK-B001	t	2026-05-25 09:30:01.888909
6	Lace-Trimmed Cotton Blouse	Lightweight cotton blouse with delicate lace trim at the collar and cuffs.	249.00	319.00	{https://images.unsplash.com/photo-1604917877934-07d56b6e31fb?q=80&w=800&auto=format&fit=crop}	2	{S,M,L}	10	New	ANK-B002	t	2026-05-25 09:30:01.893427
7	Camel Wool Trench Coat	Timeless double-breasted trench in 100% merino wool. Belted waist, storm flap, deep pockets.	1299.00	\N	{https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=800&auto=format&fit=crop}	3	{XS,S,M,L,XL}	6	Best Seller	ANK-O001	t	2026-05-25 09:30:01.897419
8	Quilted Puffer Vest	Lightweight quilted vest with goose down insulation. Side pockets, inside zip pocket. Packable.	449.00	\N	{https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop}	3	{S,M,L,XL}	9	New	ANK-O002	t	2026-05-25 09:30:01.90303
9	Pearl Drop Earrings	Freshwater pearl drops set in 14k gold vermeil. Hypoallergenic surgical steel posts.	189.00	\N	{https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop}	4	{}	30	Best Seller	ANK-A001	t	2026-05-25 09:30:01.907819
10	Cashmere Wrap Scarf	Pure cashmere wrap in a generous size. Soft fringe detailing. Grade A Mongolian cashmere.	349.00	\N	{https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=800&auto=format&fit=crop}	4	{}	18	\N	ANK-A002	t	2026-05-25 09:30:01.911851
11	Structured Leather Tote	Full-grain Italian leather tote bag. Open top, inner zip pocket, two slip pockets. Polished gold hardware.	799.00	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop,https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop}	5	{}	7	Best Seller	ANK-G001	t	2026-05-25 09:30:01.915667
12	Suede Micro Clutch	Petite suede clutch with magnetic snap closure. Card slot interior. Detachable wrist chain.	459.00	559.00	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=800&auto=format&fit=crop}	5	{}	11	New	ANK-G002	t	2026-05-25 09:30:01.920255
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, product_id, reviewer_name, reviewer_email, rating, comment, verified, created_at) FROM stdin;
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist_items (id, session_id, product_id, created_at) FROM stdin;
2	9d0cfcfa-6582-4d46-ba8f-5ea12ffa7bba	10	2026-06-24 14:51:47.695223
\.


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 2, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 14, true);


--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.newsletter_subscriptions_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 12, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: wishlist_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlist_items_id_seq', 2, true);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_email_unique UNIQUE (email);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict B2aV8Q1dbf4couSXBkDaksEcQ9qHcbT8ICzpji9DlSmTpS0wmFRWqfiMdTKYqAV

