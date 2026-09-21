const { verifySession, isValidAccountId, isValidDate } = require('./verifySession');

function makeTikTokHandler({ level, dimensions, metrics }) {
  return async (req, res) => {
    const user = await verifySession(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { advertiserId, since, until } = req.query || {};
    if (!isValidAccountId(advertiserId) || advertiserId.startsWith('act_') || !isValidDate(since) || !isValidDate(until)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const qs = new URLSearchParams({
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: level,
      dimensions: JSON.stringify(dimensions),
      metrics: JSON.stringify(metrics),
      start_date: since,
      end_date: until,
      page_size: '1000'
    });

    try {
      const apiRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?' + qs.toString(), {
        headers: { 'Access-Token': process.env.TIKTOK_ACCESS_TOKEN }
      });
      const json = await apiRes.json();
      if (json.code !== 0) return res.status(502).json({ error: json.message || 'Error de la API de TikTok' });
      res.status(200).json({ data: (json.data && json.data.list) || [] });
    } catch (e) {
      res.status(502).json({ error: 'No se pudo conectar con la API de TikTok: ' + e.message });
    }
  };
}

const BASE_METRICS = ['spend', 'impressions', 'clicks', 'conversion', 'complete_payment', 'total_complete_payment_rate'];
const VIDEO_METRICS = ['video_play_actions', 'video_watched_6s', 'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100', 'average_video_play', 'likes', 'comments', 'shares'];

module.exports = { makeTikTokHandler, BASE_METRICS, VIDEO_METRICS };
