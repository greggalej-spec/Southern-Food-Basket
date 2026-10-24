// GET /api/social-feed: the store's latest Instagram posts and TikTok videos as one small JSON feed.
//   Instagram: Instagram API with Instagram Login (business or creator account), scope instagram_business_basic.
//              Set INSTAGRAM_ACCESS_TOKEN (long-lived, refresh before its 60 days run out).
//   TikTok:    Display API, scope video.list. Set TIKTOK_ACCESS_TOKEN (user token; needs its refresh token rotated daily).
// With neither token set it answers connected:false and the page shows the posts already on the site.
// Responses are cached at the edge for 15 minutes, so the platforms are asked at most a few times an hour.
const firstLine = s => String(s || '').split('\n')[0].trim().slice(0, 90);

async function instagram(token) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = 'https://graph.instagram.com/me/media?fields=' + fields + '&limit=18&access_token=' + encodeURIComponent(token);
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('instagram ' + r.status);
  const j = await r.json();
  return (j.data || []).map(m => ({
    id: String(m.id),
    type: m.media_type === 'VIDEO' ? 'video' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image',
    image: m.media_type === 'VIDEO' ? (m.thumbnail_url || '') : (m.media_url || ''),
    title: firstLine(m.caption) || 'Instagram post',
    alt: firstLine(m.caption) || 'Instagram post',
    caption: String(m.caption || '').slice(0, 1200),
    date: m.timestamp || '',
    permalink: m.permalink || ''
  })).filter(p => /^https:\/\//.test(p.image));
}

async function tiktok(token) {
  const fields = 'id,title,video_description,cover_image_url,share_url,create_time';
  const r = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=' + fields, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_count: 12 }),
    signal: AbortSignal.timeout(6000)
  });
  if (!r.ok) throw new Error('tiktok ' + r.status);
  const j = await r.json();
  return ((j.data && j.data.videos) || []).map(v => ({
    id: String(v.id),
    title: v.title || firstLine(v.video_description) || 'TikTok video',
    cover: v.cover_image_url || '',
    permalink: v.share_url || '',
    date: v.create_time ? new Date(v.create_time * 1000).toISOString() : ''
  })).filter(v => /^https:\/\//.test(v.cover));
}

module.exports = async (req, res) => {
  const out = { instagram: { connected: false, posts: [] }, tiktok: { connected: false, videos: [] }, updated: new Date().toISOString() };
  const jobs = [];
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    jobs.push(instagram(process.env.INSTAGRAM_ACCESS_TOKEN)
      .then(posts => { out.instagram = { connected: true, posts }; })
      .catch(() => { out.instagram.error = 'Instagram did not answer'; }));
  }
  if (process.env.TIKTOK_ACCESS_TOKEN) {
    jobs.push(tiktok(process.env.TIKTOK_ACCESS_TOKEN)
      .then(videos => { out.tiktok = { connected: true, videos }; })
      .catch(() => { out.tiktok.error = 'TikTok did not answer'; }));
  }
  await Promise.all(jobs);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=900, stale-while-revalidate=3600');
  res.end(JSON.stringify(out));
};
