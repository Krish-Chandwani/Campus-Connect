import Navbar from "../components/Navbar";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen">
      <Navbar variant="solid" />
      <main className="mx-auto w-[min(900px,100%)] px-6 pb-12 pt-[calc(4.25rem+2rem)]">
        <h1 className="font-display mb-2 mt-0 text-[2.2rem] tracking-[-0.02em]">
          {title}
        </h1>
        <p className="m-0 text-muted">{description}</p>
      </main>
    </div>
  );
}
