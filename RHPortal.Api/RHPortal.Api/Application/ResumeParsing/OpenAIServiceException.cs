namespace RhPortal.Api.Application.ResumeParsing;

public sealed class OpenAIServiceException : Exception
{
    public int StatusCode { get; }

    public OpenAIServiceException(int statusCode, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }
}
