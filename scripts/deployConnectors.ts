import deployConnector, { deployConnectorArgs } from "./deployConnector";

export default async function deployConnectors(
  connectors: deployConnectorArgs[]
) {
  const instances = await Promise.all(
    connectors.map((connector) => deployConnector(connector))
  );

  return instances;
}
