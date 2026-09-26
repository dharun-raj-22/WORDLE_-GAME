function Handoff({ title, message, subMessage, buttonText, onNext }) {
  return (
    <div className="text-center w-full max-w-sm mx-auto">
      <h2 className="text-xl text-gray-400 mb-6">{title}</h2>
      <h1 className="text-3xl font-bold mb-4 text-wordle-highlight leading-tight">{message}</h1>
      <p className="text-lg text-gray-300 mb-10">{subMessage}</p>
      <button 
        onClick={onNext}
        className="w-full bg-wordle-green px-8 py-4 rounded text-xl font-bold hover:bg-green-600 active:scale-95 transition shadow-lg"
      >
        {buttonText}
      </button>
    </div>
  );
}

export default Handoff;
