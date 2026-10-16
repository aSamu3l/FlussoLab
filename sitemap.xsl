<?xml version="1.0" encoding="UTF-8"?>
<!-- Shows sitemap.xml as a page when opened in a browser. Search engines read the XML and ignore this file. -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="s xhtml image">
<xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

<xsl:template match="/">
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Mappa del sito · FlussoLab</title>
<link rel="icon" href="/icons/favicon-64.png"/>
<style>
@font-face{font-family:"Atkinson Hyperlegible";font-weight:400;font-display:swap;src:url(/fonts/atkinson-400.woff2) format("woff2")}
@font-face{font-family:"Atkinson Hyperlegible";font-weight:700;font-display:swap;src:url(/fonts/atkinson-700.woff2) format("woff2")}
@font-face{font-family:"Gabarito";font-weight:800;font-display:swap;src:url(/fonts/gabarito-800.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-weight:400;font-display:swap;src:url(/fonts/jetbrains-mono-400.woff2) format("woff2")}
:root{--paper:#fafcff;--grid:#e3eaf4;--surface:#fff;--rule:#d6dde8;--ink:#172230;--muted:#56657a;--pen:#2350c4;--pen-soft:#e5ecfc;
  --f-body:"Atkinson Hyperlegible",ui-sans-serif,system-ui,sans-serif;--f-display:"Gabarito","Atkinson Hyperlegible",ui-sans-serif,system-ui,sans-serif;--f-mono:"JetBrains Mono",ui-monospace,Consolas,monospace;color-scheme:light dark}
@media (prefers-color-scheme: dark){:root{--paper:#0f141b;--grid:#18202b;--surface:#151b24;--rule:#2a3443;--ink:#e5eaf1;--muted:#9daabb;--pen:#7fa3ff;--pen-soft:#1c2947}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:28px 28px;color:var(--ink);font:400 17px/1.55 var(--f-body)}
a{color:var(--pen)}
a:focus-visible{outline:3px solid var(--pen);outline-offset:3px;border-radius:4px}
.wrap{max-width:900px;margin:0 auto;padding:28px 16px 64px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:28px}
.brand{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font:800 21px/1 var(--f-display)}
.brand img{width:32px;height:32px;border-radius:8px}
h1{font:800 clamp(28px,6vw,40px)/1.1 var(--f-display);margin:0 0 8px;letter-spacing:-.01em}
.lead{color:var(--muted);margin:0 0 26px;max-width:62ch}
.lead span{display:block;font-size:15px}
.page{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:18px 20px;margin-bottom:14px}
.page h2{font:800 20px/1.25 var(--f-display);margin:0 0 4px}
.url{font:14px/1.4 var(--f-mono);word-break:break-all}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin:12px 0 0;font-size:14px;color:var(--muted)}
.meta b{color:var(--ink);font-weight:700}
.langs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;text-decoration:none;padding:3px 10px;border-radius:99px;background:var(--pen-soft);color:var(--pen)}
.chip small{font-weight:400;color:var(--muted)}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:14px}
.shots a{display:block;border:1px solid var(--rule);border-radius:8px;overflow:hidden;background:var(--paper);aspect-ratio:16/10}
.shots img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
footer{margin-top:28px;font-size:14px;color:var(--muted)}
footer code{font-family:var(--f-mono);font-size:13px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <a class="brand" href="/"><img src="/icons/favicon-64.png" alt=""/>FlussoLab</a>
    <a href="/app/">Apri FlussoLab</a>
  </header>
  <h1>Mappa del sito</h1>
  <p class="lead">Le pagine di FlussoLab, con le versioni nelle varie lingue e le immagini che contengono.
    <span lang="en">Site map: FlussoLab pages, their language versions and the images they contain.</span></p>

  <xsl:for-each select="s:urlset/s:url">
    <xsl:variable name="path" select="substring-after(s:loc, '.s3l.it')"/>
    <section class="page">
      <h2>
        <xsl:choose>
          <xsl:when test="$path = '/'">Benvenuto <small style="font-weight:400;color:var(--muted)">· italiano</small></xsl:when>
          <xsl:when test="$path = '/en/'">Welcome <small style="font-weight:400;color:var(--muted)">· English</small></xsl:when>
          <xsl:when test="$path = '/app/'">L'app <small style="font-weight:400;color:var(--muted)">· the app</small></xsl:when>
          <xsl:otherwise><xsl:value-of select="$path"/></xsl:otherwise>
        </xsl:choose>
      </h2>
      <a class="url" href="{s:loc}"><xsl:value-of select="s:loc"/></a>
      <div class="meta">
        <xsl:if test="s:lastmod"><span>Aggiornata <b><xsl:value-of select="s:lastmod"/></b></span></xsl:if>
        <xsl:if test="s:changefreq"><span>Controllo <b>
          <xsl:choose>
            <xsl:when test="s:changefreq = 'monthly'">mensile</xsl:when>
            <xsl:when test="s:changefreq = 'weekly'">settimanale</xsl:when>
            <xsl:when test="s:changefreq = 'daily'">giornaliero</xsl:when>
            <xsl:otherwise><xsl:value-of select="s:changefreq"/></xsl:otherwise>
          </xsl:choose></b></span></xsl:if>
        <xsl:if test="s:priority"><span>Priorità <b><xsl:value-of select="s:priority"/></b></span></xsl:if>
      </div>
      <xsl:if test="xhtml:link">
        <div class="langs">
          <xsl:for-each select="xhtml:link">
            <a class="chip" href="{@href}">
              <xsl:choose>
                <xsl:when test="@hreflang = 'it'">Italiano</xsl:when>
                <xsl:when test="@hreflang = 'en'">English</xsl:when>
                <xsl:when test="@hreflang = 'x-default'">Predefinita</xsl:when>
                <xsl:otherwise><xsl:value-of select="@hreflang"/></xsl:otherwise>
              </xsl:choose>
              <small><xsl:value-of select="substring-after(@href, '.s3l.it')"/></small>
            </a>
          </xsl:for-each>
        </div>
      </xsl:if>
      <xsl:if test="image:image">
        <div class="shots">
          <xsl:for-each select="image:image">
            <a href="{image:loc}"><img src="{substring-after(image:loc, '.s3l.it')}" alt="" loading="lazy"/></a>
          </xsl:for-each>
        </div>
      </xsl:if>
    </section>
  </xsl:for-each>

  <footer><xsl:value-of select="count(s:urlset/s:url)"/> pagine · <xsl:value-of select="count(s:urlset/s:url/image:image)"/> immagini · questo è il file <code>sitemap.xml</code> letto dai motori di ricerca.</footer>
</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
