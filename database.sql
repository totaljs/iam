-- ===================================================
-- TABLES
-- ===================================================

CREATE TABLE "public"."cl_country" (
	"id" varchar(3) NOT NULL,
	"name" varchar(50),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."cl_ip" (
	"id" varchar(80) NOT NULL,
	"city" varchar(50),
	"regioncode" varchar(10),
	"region" varchar(50),
	"countrycode" varchar(10),
	"country" varchar(50),
	"continent" varchar(50),
	"continentcode" varchar(10),
	"lat" float8 DEFAULT '0'::double precision,
	"lon" float8 DEFAULT '0'::double precision,
	"zip" varchar(20),
	"code" varchar(3),
	"dtcreated" timestamp,
	"dtupdated" timestamp,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."cl_language" (
	"id" varchar(5) NOT NULL,
	"name" varchar(20),
	"spoken" varchar(50),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."cl_logger" (
	"id" varchar(25) NOT NULL,
	"name" varchar(25),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."cl_oauth" (
	"id" varchar(25) NOT NULL,
	"name" varchar(25),
	"color" varchar(7),
	"client_id" varchar(100),
	"client_secret" varchar(100),
	"isdisabled" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"dtused" timestamp,
	"dtcreated" timestamp,
	"dtupdated" timestamp,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user" (
	"id" varchar(25) NOT NULL,
	"language" varchar(2),
	"verifycode" varchar(10),
	"login" varchar(120),
	"password" varchar(70),
	"email" varchar(120),
	"phone" varchar(30),
	"sa" bool DEFAULT false,
	"istwofactor" bool DEFAULT false,
	"isnotify" bool DEFAULT false,
	"isonline" bool DEFAULT false,
	"isdeveloper" bool DEFAULT false,
	"isconfirmed" bool DEFAULT false,
	"isverified" bool DEFAULT false,
	"isdisabled" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"iscancel" bool DEFAULT false,
	"isinactive" bool DEFAULT false,
	"dateformat" varchar(20),
	"timeformat" int2,
	"dtlogged" timestamp,
	"dtconfirmed" timestamp,
	"dtcreated" timestamp,
	"dtupdated" timestamp,
	"dtremoved" timestamp,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user_profile" (
	"id" varchar(25) NOT NULL,
	"countryid" varchar(25),
	"photo" varchar(50),
	"userid" varchar(25),
	"verifycode" varchar(10),
	"language" varchar(2),
	"name" varchar(50),
	"reference" varchar(50),
	"nick" varchar(50),
	"linker" varchar(50),
	"firstname" varchar(25),
	"lastname" varchar(25),
	"email" varchar(120),
	"email2" varchar(120),
	"phone" varchar(30),
	"gender" varchar(6),
	"url" varchar(100),
	"search" varchar(80),
	"company" varchar(50),
	"position" varchar(50),
	"location" varchar(50),
	"address" varchar(50),
	"city" varchar(50),
	"zip" varchar(20),
	"country" varchar(50),
	"countrycode" varchar(10),
	"state" varchar(50),
	"dateformat" varchar(20),
	"timeformat" int2,
	"rating" int2,
	"isconfirmed" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"dtbirth" timestamp,
	"dtupdated" timestamp,
	"dtcreated" timestamp,
	"dtremoved" timestamp,
	CONSTRAINT "tbl_user_profile_language_fkey" FOREIGN KEY ("language") REFERENCES "public"."cl_language"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_profile_locationid_fkey" FOREIGN KEY ("countryid") REFERENCES "public"."cl_country"("id") ON DELETE CASCADE,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user_device" (
	"id" varchar(60) NOT NULL,
	"uid" varchar(100),
	"userid" varchar(25),
	"ua" varchar(150),
	"ismobile" bool DEFAULT false,
	"isdisabled" bool DEFAULT false,
	"dtused" timestamp,
	"dtcreated" timestamp,
	"dtupdated" timestamp,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_app" (
	"id" varchar(25) NOT NULL,
	"userid" varchar(25),
	"client_id" varchar(30),
	"client_secret" varchar(50),
	"name" varchar(50),
	"icon" varchar(50),
	"description" varchar(100),
	"author" varchar(50),
	"email" varchar(120),
	"phone" varchar(30),
	"host" varchar(60),
	"url" varchar(100),
	"urlprivacy" varchar(200),
	"urlterms" varchar(200),
	"urlcallback" varchar(300),
	"urlremove" varchar(300),
	"urlupdate" varchar(300),
	"urllogout" varchar(300),
	"fields" varchar(300),
	"search" varchar(100),
	"isdisabled" bool DEFAULT false,
	"isconfirmed" bool DEFAULT false,
	"isinactive" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"dtused" timestamp,
	"dtcreated" timestamp,
	"dtupdated" timestamp,
	"dtremoved" timestamp,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user_logger" (
	"id" varchar(25) NOT NULL,
	"userid" varchar(25),
	"profileid" varchar(25),
	"appid" varchar(25),
	"loggerid" varchar(25),
	"deviceid" varchar(60),
	"city" varchar(50),
	"regioncode" varchar(10),
	"region" varchar(50),
	"countrycode" varchar(10),
	"country" varchar(50),
	"continentcode" varchar(10),
	"continent" varchar(50),
	"zip" varchar(20),
	"ip" varchar(60),
	"lat" float8,
	"lon" float8,
	"isgeoip" bool DEFAULT false,
	"ismobile" bool DEFAULT false,
	"dtcreated" timestamp,
	CONSTRAINT "tbl_user_logger_loggerid_fkey" FOREIGN KEY ("loggerid") REFERENCES "public"."cl_logger"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_logger_profileid_fkey" FOREIGN KEY ("profileid") REFERENCES "public"."tbl_user_profile"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_logger_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."tbl_user"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_logger_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_logger_deviceid_fkey" FOREIGN KEY ("deviceid") REFERENCES "public"."tbl_user_device"("id") ON DELETE CASCADE,
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user_oauth" (
	"id" varchar(25) NOT NULL,
	"oauthid" varchar(25),
	"userid" varchar(25),
	"externalid" varchar(50),
	"token" varchar(100),
	"name" varchar(50),
	"email" varchar(120),
	"isdisabled" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"dtlogged" timestamp,
	"dtupdated" timestamp,
	"dtcreated" timestamp,
	CONSTRAINT "tbl_user_oauth_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."tbl_user"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_oauth_oauthid_fkey" FOREIGN KEY ("oauthid") REFERENCES "public"."cl_oauth"("id"),
	PRIMARY KEY ("id")
);

CREATE TABLE "public"."tbl_user_session" (
	"id" varchar(25) NOT NULL,
	"userid" varchar(25),
	"profileid" varchar(25),
	"appid" varchar(25),
	"deviceid" varchar(60),
	"fields" varchar(300),
	"bearer" varchar(100),
	"iscanceled" bool DEFAULT false,
	"isremoved" bool DEFAULT false,
	"countaccessed" int4 DEFAULT 0,
	"dtaccessed" timestamp,
	"dtexpired" timestamp,
	"dtcreated" timestamp,
	"dtcanceled" timestamp,
	CONSTRAINT "tbl_user_session_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."tbl_user"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_session_appid_fkey" FOREIGN KEY ("appid") REFERENCES "public"."tbl_app"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_session_profileid_fkey" FOREIGN KEY ("profileid") REFERENCES "public"."tbl_user_profile"("id") ON DELETE CASCADE,
	CONSTRAINT "tbl_user_session_deviceid_fkey" FOREIGN KEY ("deviceid") REFERENCES "public"."tbl_user_device"("id") ON DELETE CASCADE,
	PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."tbl_user_oauth"."name" IS 'A profile name';
COMMENT ON COLUMN "public"."tbl_user_profile"."email2" IS 'E-mail address for confirmation.';

-- ===================================================
-- VIEWS
-- ===================================================

CREATE VIEW view_user AS
	SELECT
		a.id,
		a.email,
		a.phone,
		a.sa,
		a.istwofactor,
		a.isdisabled,
		a.isconfirmed,
		a.isinactive,
		a.isonline,
		a.isdeveloper,
		a.dtlogged,
		a.dtcreated,
		a.dtupdated,
		a.dtconfirmed,
		(SELECT count(1) AS count FROM tbl_user_profile b WHERE b.userid = a.id AND b.isremoved = false)::integer AS countprofiles,
		a.dateformat,
		a.timeformat,
		a.language,
		a.isnotify,
		a.iscancel
	FROM tbl_user a
	WHERE a.isremoved = false;

CREATE VIEW view_user_logger AS
	SELECT
		a.id,
		a.userid,
		a.profileid,
		a.appid,
		a.deviceid,
		b.name AS profilename,
		c.ua AS devicename,
		c.ismobile AS devicemobile,
		d.name AS appname,
		d.icon AS appicon,
		e.name AS loggername,
		a.ip,
		a.country,
		a.countrycode,
		a.continent,
		a.continentcode,
		a.region,
		a.regioncode,
		a.city,
		a.lat,
		a.lon,
		c.isdisabled,
		a.isgeoip,
		a.dtcreated
	FROM tbl_user_logger a
		LEFT JOIN tbl_user_profile b ON b.id = a.profileid
		LEFT JOIN tbl_user_device c ON c.id = a.deviceid
		LEFT JOIN tbl_app d ON d.id = a.appid
		LEFT JOIN cl_logger e ON e.id = a.loggerid

CREATE VIEW view_user_session AS
	SELECT
		a.id,
		a.userid,
		a.profileid,
		a.appid,
		a.deviceid,
		a.iscanceled,
		a.countaccessed,
		c.ua AS devicename,
		b.name AS profilename,
		d.name AS appname,
		d.icon AS appicon,
		a.fields,
		d.fields AS fieldsmain,
		c.ismobile AS devicemobile,
		a.dtcreated,
		a.dtexpired,
		a.dtaccessed,
		d.url
	FROM tbl_user_session a
		LEFT JOIN tbl_user_profile b ON b.id = a.profileid
		LEFT JOIN tbl_user_device c ON c.id = a.deviceid
		LEFT JOIN tbl_app d ON d.id = a.appid
	WHERE a.iscanceled = false AND a.isremoved = false;

CREATE VIEW view_oauth_session AS
SELECT
	a.id,
	a.appid,
	a.userid,
	a.profileid,
	a.deviceid,
	a.fields,
	b.fields AS fieldsmain,
	a.countaccessed,
	a.bearer,
	b.url,
	b.urlcallback,
	b.urlupdate,
	b.urlremove,
	b.urllogout,
	b.client_id,
	b.client_secret,
	a.iscanceled,
	a.dtaccessed,
	a.dtexpired,
	a.dtcanceled
FROM tbl_user_session a
	LEFT JOIN tbl_app b ON b.id = a.appid AND b.isremoved = false AND b.isdisabled = false AND b.isinactive = false;

-- ===================================================
-- FUNCTIONS
-- ===================================================

CREATE OR REPLACE FUNCTION public.fn_device(a_obj json)
	RETURNS boolean
	LANGUAGE plpgsql
AS $function$

DECLARE count INT = 0;
DECLARE disabled BOOLEAN = false;

BEGIN

	SELECT isdisabled, 1::int into disabled, count FROM tbl_user_device WHERE id=a_obj->>'id' LIMIT 1;

	RAISE NOTICE 'Values % %', disabled, count;

	IF count IS NULL THEN
		INSERT INTO tbl_user_device (id, userid, uid, ua, ismobile, isdisabled, dtcreated, dtused) VALUES(a_obj->>'id', a_obj->>'userid', a_obj->>'uid', a_obj->>'ua', (a_obj->>'ismobile')::boolean, false, NOW(), NOW());
		RETURN TRUE;
	ELSEIF disabled = false THEN
		UPDATE tbl_user_device SET dtused=NOW() WHERE id=a_obj->>'id';
		RETURN TRUE;
	END IF;

	RETURN FALSE;
END;
$function$

CREATE OR REPLACE FUNCTION public.fn_userapps(a_userid character varying)
	RETURNS TABLE(id character varying, name character varying, icon character varying, description character varying, url character varying, author character varying, email character varying, phone character varying, urlterms character varying, urlprivacy character varying)
	LANGUAGE plpgsql
AS $function$
BEGIN
	RETURN QUERY SELECT a.id, a."name", a.icon, a.description, a.url, a.author, a.email, a.phone, a.urlterms, a.urlprivacy FROM tbl_app a WHERE a.isremoved=FALSE AND a.isdisabled=FALSE AND a.id in (SELECT b.appid FROM tbl_user_session b WHERE b.isremoved=FALSE AND b.userid=a_userid);
END;
$function$

CREATE OR REPLACE FUNCTION public.fn_userappsprofiles(a_userid character varying, a_appid character varying)
	RETURNS TABLE(profileid character varying, userid character varying, name character varying, sessionid character varying)
	LANGUAGE plpgsql
AS $function$
BEGIN
	RETURN QUERY SELECT a.id as profileid, a.userid, a.name, (SELECT x.id FROM tbl_user_session x WHERE x.profileid=a.id AND x.appid=a_appid AND x.isremoved=false AND x.iscanceled=FALSE LIMIT 1) as sessionid FROM tbl_user_profile a WHERE a.userid=a_userid AND a.isconfirmed=TRUE AND a.isremoved=FALSE AND a.id IN (SELECT y.profileid FROM tbl_user_session y WHERE y.userid=a.userid AND y.appid=a_appid);
END;
$function$