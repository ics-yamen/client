import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
export const PROJECT_FRAMEWORK = gql`
    query ProjectFramework(
        $projectId: ID!,
        $leadId: ID!,
    ) {
        project(id: $projectId) {
            lead(id: $leadId) {
                entries {
                    clientId
                    id
                    image {
                        file {
                            name
                            url
                        }
                    }
                    imageRaw
                    excerpt
                }
            }
            analysisFramework {
                primaryTagging {
                    widgets {
                        id
                        clientId
                        key
                        order
                        properties
                        title
                        widgetId
                        width
                    }
                    clientId
                    id
                    order
                    title
                    tooltip
                }
                secondaryTagging {
                    clientId
                    id
                    key
                    order
                    title
                    properties
                    widgetId
                    width
                }
                id
            }
        }
    }
`;
