/**
 * Bloco de agradecimento (mensagem + vídeo opcional).
 * É aqui que você personaliza a tela de obrigado no futuro.
 * Por enquanto o texto e o vídeo vêm da tabela listas_presentes
 * (colunas agradecimento_mensagem e agradecimento_video_url).
 */
function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export default function BlocoAgradecimento({ mensagem, videoUrl }: { mensagem: string; videoUrl: string | null }) {
  const yt = videoUrl ? youtubeEmbed(videoUrl) : null;
  const arquivo = videoUrl && /\.(mp4|webm)(\?.*)?$/i.test(videoUrl);

  return (
    <div className="space-y-6">
      <p className="font-display text-xl leading-relaxed">{mensagem}</p>

      {yt && (
        <iframe
          src={yt}
          title="Vídeo de agradecimento dos noivos"
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-2xl border border-ouro/30"
        />
      )}
      {arquivo && (
        <video src={videoUrl!} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl border border-ouro/30 bg-cacau/10" />
      )}
    </div>
  );
}