using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.ApiResponse
{
    public class ApiResponse<T>
    {
        public T Data { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
        public int StatusCode { get; set; }

        public ApiResponse(T data, bool success, string message, int statusCode)
        {
            Data = data;
            Success = success;
            Message = message;
            StatusCode = statusCode;
        }

        public ApiResponse(bool success, string message, int statusCode)
        {
            Success = success;
            Message = message;
            StatusCode = statusCode;
        }
    }
    public class ApiException : Exception
    {
        public bool Success { get; }
        public object Error { get; }
        public int StatusCode { get; }

        public ApiException(object error, int statusCode = StatusCodes.Status400BadRequest)
            : base(error is IEnumerable<string> list ? string.Join("; ", list) : error?.ToString())
        {
            Success = false;
            Error = error;
            StatusCode = statusCode;
        }
    }


    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ApiException ex)
            {
                await WriteErrorResponse(context, ex.StatusCode, ex.Error);
            }
            catch (Exception)
            {
                await WriteErrorResponse(context, StatusCodes.Status500InternalServerError, "Internal Server Error");
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, int statusCode, object error)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var response = new
            {
                success = false,
                error,
                statusCode
            };

            await context.Response.WriteAsJsonAsync(response);
        }
    }


    public class ValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                // ✅ Throw ApiException thay vì return
                throw new ApiException(errors, StatusCodes.Status400BadRequest);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
