import { BaseProcessor } from "./BaseProcessor";
import GlobalProcessor from "./GlobalProcessor";
import InheritedProcessor from "./InheritedProcessor";

import { getEnvValueAsBoolean } from "../utils/EnvUtil";

const processor: BaseProcessor = getEnvValueAsBoolean("GLOBAL_IMPORT") ? new GlobalProcessor() : new InheritedProcessor();
export default processor;