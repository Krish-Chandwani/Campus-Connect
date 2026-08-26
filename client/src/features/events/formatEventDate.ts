function formatEventDate(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleString("en-US", { month: "short" }),
    day: String(date.getDate()),
    time: date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default formatEventDate;
