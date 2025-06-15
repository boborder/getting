import { Link, isRouteErrorResponse, useRouteError, useNavigate } from "react-router";
import { Collapse } from "~/components/ui/Collapse";

export const Errors = () => {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "Requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="h-hull w-full p-2 grid place-content-center place-items-center">
      <h2 className="text-3xl m-3">{message}</h2>
      {stack
        ? <Collapse title={details} content={stack} />
        : <p>{details}</p>
      }
      <Link to="/" className="my-3 cursor-progress">
        <img src="/assets/bg.png" alt="error" height={256} width={256} />
      </Link>
      <p>Click the image to back to the home</p>
      <button type="button" onClick={() => navigate(-1)} className="my-3">
        Back to the previous page
      </button>
    </div>
  );
};
