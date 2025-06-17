import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Wifi, WifiOff } from 'lucide-react'
import { CollaborationUser } from '@/utils/collaboration'

interface CollaborationStatusProps {
  users: CollaborationUser[]
  isConnected: boolean
  currentUser: CollaborationUser
}

export default function CollaborationStatus({
  users,
  isConnected,
  currentUser,
}: CollaborationStatusProps) {
  const totalUsers = users.length + 1 // Include current user

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Users Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-xs">{totalUsers}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3" align="end">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Who's here</h4>
            
            {/* Current User */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback 
                  className="text-xs font-medium"
                  style={{ backgroundColor: currentUser.color + '20', color: currentUser.color }}
                >
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUser.name} (You)
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            </div>

            {/* Other Users */}
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback 
                    className="text-xs font-medium"
                    style={{ backgroundColor: user.color + '20', color: user.color }}
                  >
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user.name}</p>
                </div>
                <Badge 
                  variant={user.isOnline ? "secondary" : "outline"} 
                  className="text-xs"
                >
                  {user.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                You're working alone
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 