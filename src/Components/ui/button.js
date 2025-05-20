export function Button({ children, ...props }) {
    return (
      <button className="btn btn-secondary px-4 py-2 rounded" {...props}>
        {children}
      </button>
    );
  }
  