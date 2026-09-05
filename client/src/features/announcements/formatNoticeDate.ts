export default function formatNoticeDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: "—", timeLabel: "" };
  }

  return {
    dateLabel: date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    timeLabel: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}
