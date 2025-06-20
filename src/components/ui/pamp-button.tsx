import { Button } from '@/components/ui/button.tsx'
import { Card } from '@/components/ui/card.tsx'

type PampButtonProps = {
    message: string
    onClick?: () => void
}
export default function PampButton({ message, onClick }: PampButtonProps) {
    return (
        <Card
            className="p-4 flex flex-row items-center w-fit"
            style={{ cursor: 'pointer' }}
            onClick={() => (onClick ? onClick() : null)}
        >
            <Button size="icon" className="border-1 border-ring">
                +
            </Button>
            {message}
        </Card>
    )
}
