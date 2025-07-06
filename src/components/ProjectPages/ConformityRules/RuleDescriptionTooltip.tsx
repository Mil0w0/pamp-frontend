import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { HelpCircleIcon } from 'lucide-react'

export default function RuleDescriptionTooltip({
    message,
}: {
    message: string
}) {
    return (
        <Tooltip>
            <TooltipTrigger>
                <HelpCircleIcon />
            </TooltipTrigger>
            <TooltipContent>
                <p>{message}</p>
            </TooltipContent>
        </Tooltip>
    )
}
