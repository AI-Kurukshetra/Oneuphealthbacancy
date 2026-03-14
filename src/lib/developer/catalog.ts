type EndpointDoc = {
  description: string;
  method: "GET" | "POST";
  path: string;
  sampleRequest: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  };
  sampleResponse: Record<string, unknown>;
  title: string;
};

export const DEVELOPER_ENDPOINTS: EndpointDoc[] = [
  {
    description: "Return a list of patients visible to the authenticated principal.",
    method: "GET",
    path: "/api/patients",
    sampleRequest: {
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
      },
    },
    sampleResponse: {
      success: true,
      data: [
        {
          id: "patient-001",
          first_name: "Ava",
          last_name: "Patel",
          date_of_birth: "1989-07-11",
        },
      ],
    },
    title: "List patients",
  },
  {
    description: "Fetch a single patient resource by identifier.",
    method: "GET",
    path: "/api/patients/{id}",
    sampleRequest: {
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
      },
    },
    sampleResponse: {
      success: true,
      data: {
        id: "patient-123",
        first_name: "Mila",
        last_name: "Shah",
        date_of_birth: "1992-03-04",
        observations: [],
        medications: [],
      },
    },
    title: "Fetch patient record",
  },
  {
    description: "Create a new encounter for a patient visit.",
    method: "POST",
    path: "/api/encounters",
    sampleRequest: {
      body: {
        patient_id: "patient-123",
        provider_id: "provider-321",
        organization_id: "org-100",
        visit_date: "2026-03-14T09:30:00.000Z",
        reason: "Follow-up consultation",
        diagnosis: "Hypertension",
        notes: "Blood pressure remains elevated.",
      },
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
        "Content-Type": "application/json",
      },
    },
    sampleResponse: {
      success: true,
      data: {
        id: "encounter-001",
        patient_id: "patient-123",
        diagnosis: "Hypertension",
      },
    },
    title: "Create encounter",
  },
  {
    description: "Submit a new clinical observation such as a lab result or vital.",
    method: "POST",
    path: "/api/observations",
    sampleRequest: {
      body: {
        patient_id: "patient-123",
        encounter_id: "encounter-001",
        type: "Blood Glucose",
        value: "168",
        unit: "mg/dL",
        observed_at: "2026-03-14T10:00:00.000Z",
      },
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
        "Content-Type": "application/json",
      },
    },
    sampleResponse: {
      success: true,
      data: {
        id: "observation-001",
        patient_id: "patient-123",
        type: "Blood Glucose",
        value: "168",
      },
    },
    title: "Create observation",
  },
  {
    description: "Create a medication or prescription record for a patient.",
    method: "POST",
    path: "/api/medications",
    sampleRequest: {
      body: {
        patient_id: "patient-123",
        provider_id: "provider-321",
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        start_date: "2026-03-14",
      },
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
        "Content-Type": "application/json",
      },
    },
    sampleResponse: {
      success: true,
      data: {
        id: "medication-001",
        patient_id: "patient-123",
        name: "Metformin",
      },
    },
    title: "Create medication",
  },
  {
    description: "Return insurance claims available to the authenticated caller.",
    method: "GET",
    path: "/api/claims",
    sampleRequest: {
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
      },
    },
    sampleResponse: {
      success: true,
      data: [
        {
          id: "claim-001",
          patient_id: "patient-123",
          amount: 4200,
          status: "pending",
        },
      ],
    },
    title: "List claims",
  },
  {
    description: "Return consent records for a patient via query parameter.",
    method: "GET",
    path: "/api/consent?patient_id={id}",
    sampleRequest: {
      headers: {
        Authorization: "Bearer hb_live_xxxxxxxx",
      },
    },
    sampleResponse: {
      success: true,
      data: [
        {
          id: "consent-001",
          patient_id: "patient-123",
          organization_id: "org-100",
          access_type: "claims",
          granted: true,
        },
      ],
    },
    title: "List consent records",
  },
];

export function buildOpenApiSpec(baseUrl = "http://localhost:3000") {
  const paths = Object.fromEntries(
    DEVELOPER_ENDPOINTS.map((endpoint) => [
      endpoint.path.replace(/\{id\}/g, "{id}"),
      {
        [endpoint.method.toLowerCase()]: {
          description: endpoint.description,
          responses: {
            200: {
              content: {
                "application/json": {
                  example: endpoint.sampleResponse,
                },
              },
              description: "Successful response",
            },
          },
          summary: endpoint.title,
        },
      },
    ]),
  );

  return {
    openapi: "3.0.3",
    info: {
      title: "HealthBridge FHIR Developer API",
      version: "1.0.0",
    },
    servers: [
      {
        url: baseUrl,
      },
    ],
    paths,
  };
}

export function buildPostmanCollection(baseUrl = "http://localhost:3000") {
  return {
    info: {
      name: "HealthBridge Developer Collection",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: DEVELOPER_ENDPOINTS.map((endpoint) => ({
      name: endpoint.title,
      request: {
        body: endpoint.sampleRequest.body
          ? {
              mode: "raw",
              raw: JSON.stringify(endpoint.sampleRequest.body, null, 2),
            }
          : undefined,
        header: Object.entries(endpoint.sampleRequest.headers ?? {}).map(([key, value]) => ({
          key,
          value,
        })),
        method: endpoint.method,
        url: {
          host: [baseUrl],
          path: endpoint.path.replace(/^\//, "").split("/"),
          raw: `${baseUrl}${endpoint.path}`,
        },
      },
      response: [
        {
          body: JSON.stringify(endpoint.sampleResponse, null, 2),
          name: "Example response",
        },
      ],
    })),
  };
}
