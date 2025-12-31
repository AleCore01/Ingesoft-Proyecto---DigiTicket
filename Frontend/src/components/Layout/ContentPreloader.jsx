import { PulseLoader } from "react-spinners";

const override = {
  display: "block",
  margin: "0 auto",
};

function ContentPreLoader({ loading, text = "Cargando..." }) {
  if (!loading) return null;

  return (
    <div className="content-preloader" style={{ textAlign: "center", padding: "1rem" }}>
      <p className="text-black text-sm font-semibold mb-3">{text}</p>
      <PulseLoader
        color="#cb00e3"
        loading={loading}
        cssOverride={override}
        size={30}
        margin={10}
        aria-label="Content Preloader"
        data-testid="pulse-loader"
      />
    </div>
  );
}

export default ContentPreLoader;