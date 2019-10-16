export const createResponse = (statusCode: number, content: any) => {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(content)
    };
}